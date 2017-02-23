import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { errorDefinitions } from '../error/errors';
import { Back } from '../chrome/link';
import { performRegister2 } from '../actions/register2';
import Full from '../layout/full';

const TOPUP_AMOUNT = 500;

const setCursorPosition = (element) => () => {
  requestAnimationFrame(() => {
    element.selectionStart = element.selectionEnd = element.value.length;
  });
};

class Card extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      number: '',
      exp: '',
      cvc: ''
    };
  }

  handleNumberChange(event) {
    const matches = event.target.value.match(/\d/g);
    const numbers = matches == null ? [] : [...matches];
    const number = numbers.reduce((output, number, index) => {
      const separator = (index % 4 === 0 && index > 0) ? ' ' : '';
      return `${output}${separator}${number}`;
    }, '');

    this.setState({ number: number.substr(0, 19) }, setCursorPosition(event.target));
  }

  handleExpChange(event) {
    let matches = event.target.value.match(/\d/g);

    const previousExp = this.state.exp;
    const separator = ' / ';
    const separatorStartIndex = previousExp.indexOf(separator);

    if (separatorStartIndex > -1) {
      const separatorEndIndex = separatorStartIndex + (separator.length - 1);
      const newExp = event.target.value;
      const removeSeparatorAndPriorDigit = previousExp.length === separatorEndIndex + 1 && newExp.length === separatorEndIndex;
      if (removeSeparatorAndPriorDigit) {
        matches = matches.slice(0, matches.length - 1);
      }
    }

    const numbers = matches == null ? [] : [...matches];
    const exp = numbers.reduce((output, number, index) => {
      const suffix = index === 1 ? `${separator}` : ``;
      return `${output}${number}${suffix}`;
    }, '');
    this.setState({ exp: exp.substr(0, 7) }, setCursorPosition(event.target));
  }

  handleCVCChange(event) {
    const matches = event.target.value.match(/\d/g);
    const numbers = matches == null ? [] : [...matches];
    const cvc = numbers.join('');
    this.setState({ cvc: cvc.substr(0, 3) }, setCursorPosition(event.target));
  }

  handleSubmit(e) {
    e.preventDefault();
    const { storeCode, itemId, emailAddress, performRegister2 } = this.props;
    const { number, cvc, exp } = this.state;
    const cardDetails = { number, cvc, exp };
    performRegister2({ storeCode, itemID: itemId, topUpAmount: TOPUP_AMOUNT, emailAddress, cardDetails });
  }

  getConfirmButtonText() {
    const topUpText = 'Confirm £5 Top Up';
    const { itemId } = this.props;
    return itemId ? `${topUpText} & Pay` : topUpText;
  }

  render() {
    const { error } = this.props;
    const { number, exp, cvc } = this.state;
    return (
      <Full top={<Back>Register</Back>}>
        <form onSubmit={(e) => this.handleSubmit(e)}>
          {
            error ?
              <div className="red">
                <p>There was a problem collecting payment from your card, please check the details</p>
                <p>
                {
                  error.code
                  ? errorDefinitions[error.code].message
                  : error.message
                }
                </p>
              </div>
              :
              <div>
                <p>Please enter the details of the card you want us to collect your first £5 top up from</p>
                <p>Don't worry, your balance won't expire, we'll never perform a top up without your
                          permission and you can close your account at any time</p>
              </div>
          }
          <p>
            <input name="number"
              autoComplete="cc-number"
              placeholder="1111 2222 3333 4444"
              className={(error != null && error.param === 'number') ? 'input border-red' : 'input'}
              value={number}
              pattern="[0-9]*"
              noValidate
              onChange={(e) => this.handleNumberChange(e)} />
          </p>
          <p className="register-card-tight">
            <input name="exp"
              autoComplete="cc-exp"
              value={exp}
              pattern="[0-9]*"
              noValidate
              placeholder="Expiry (MM / YY)"
              className={(error != null && error.param === 'exp') ? 'input border-red' : 'input'}
              onChange={(e) => this.handleExpChange(e)} />
            <input name="cvc"
              autoComplete="cc-csc"
              value={cvc}
              pattern="[0-9]*"
              noValidate
              placeholder="CVV (3-digits)"
              className={(error != null && error.param === 'cvc') ? 'input border-red' : 'input'}
              onChange={(e) => this.handleCVCChange(e)} />
          </p>
          <p><Link className="btn btn-primary" onClick={(e) => this.handleSubmit(e)}>{this.getConfirmButtonText()}</Link></p>
        </form>
      </Full>
    );
  }
}

const mapStateToProps = (
  {
    error: backendError,
    register: { error: validationError }
  },
  {
    params: { itemId, emailAddress }
  }
) => ({
  itemId,
  emailAddress,
  error: validationError || backendError
});

const mapDispatchToProps = { performRegister2 };


export default connect(mapStateToProps, mapDispatchToProps)(Card);
