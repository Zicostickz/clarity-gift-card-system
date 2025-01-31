;; Gift Card Contract

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-already-claimed (err u101))
(define-constant err-invalid-amount (err u102))
(define-constant err-card-not-found (err u103))

;; Data Variables
(define-data-var next-card-id uint u0)

;; Data Maps
(define-map gift-cards
    uint
    {
        amount: uint,
        creator: principal,
        recipient: (optional principal),
        claimed: bool,
        message: (string-utf8 280)
    }
)

;; Public Functions
(define-public (create-gift-card (amount uint) (recipient (optional principal)) (message (string-utf8 280)))
    (let 
        (
            (card-id (var-get next-card-id))
        )
        (if (> amount u0)
            (begin
                (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
                (map-set gift-cards card-id {
                    amount: amount,
                    creator: tx-sender,
                    recipient: recipient,
                    claimed: false,
                    message: message
                })
                (var-set next-card-id (+ card-id u1))
                (ok card-id)
            )
            err-invalid-amount
        )
    )
)

(define-public (claim-gift-card (card-id uint))
    (let (
        (card (unwrap! (map-get? gift-cards card-id) err-card-not-found))
    )
        (asserts! (not (get claimed card)) err-already-claimed)
        (match (get recipient card)
            recipient-principal (asserts! (is-eq tx-sender recipient-principal) err-owner-only)
            true
        )
        (try! (as-contract (stx-transfer? (get amount card) tx-sender tx-sender)))
        (map-set gift-cards card-id (merge card { claimed: true }))
        (ok true)
    )
)

;; Read Only Functions
(define-read-only (get-gift-card (card-id uint))
    (ok (map-get? gift-cards card-id))
)

(define-read-only (get-card-count)
    (ok (var-get next-card-id))
)
