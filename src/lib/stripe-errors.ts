/**
 * Maps Stripe decline codes to localized dictionary keys.
 */
export function getStripeErrorMessage(error: any, dict: any): string {
    if (!error) return dict.errors.unexpectedError;

    const code = error.decline_code || error.code;
    const stripeErrors = dict.errors.stripe;

    switch (code) {
        case "card_declined":
        case "do_not_honor":
            return stripeErrors.card_declined;
        case "expired_card":
            return stripeErrors.expired_card;
        case "incorrect_cvc":
        case "invalid_cvc":
            return stripeErrors.incorrect_cvc;
        case "insufficient_funds":
            return stripeErrors.insufficient_funds;
        case "processing_error":
            return stripeErrors.processing_error;
        default:
            return error.message || dict.errors.unexpectedError;
    }
}
