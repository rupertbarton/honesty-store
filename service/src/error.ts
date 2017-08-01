// this is duplicated in javascript @ web/src/chrome/errors.js

export type ErrorCode =
  'MaxBalanceExceeded' |
  'TooManyPurchaseItems' |
  'EmailNotFound' |
  'NoCardDetailsPresent' |
  'StoreNotFound' |
  'ListingExists' |
  'ListingNotFound' |
  'CardIncorrectNumber' |
  'CardInvalidNumber' |
  'CardInvalidExpiryMonth' |
  'CardInvalidExpiryYear' |
  'CardIncorrectCVC' |
  'CardInvalidCVC' |
  'CardExpired' |
  'CardDeclined' |
  'CardError' |
  'LessThan24HoursSinceLastTopup' |
  'TopupAlreadyInProgress' |
  'NoTopupRetriesRemaining' |
  'AccessTokenExpired' |
  'RefreshTokenExpired' |
  'MagicLinkTokenExpired' |
  'TokenError' |
  'FullRegistrationRequired' |
  'AutoRefundPeriodExpired' |
  'RefundAlreadyIssued' |
  'NonRefundableTransactionType' |
  'UserLoggedOut' |
  'AccessDenied' |
  'AvailableCountInvalid' |
  'UnknownError';

export class CodedError extends Error {
  public code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}
