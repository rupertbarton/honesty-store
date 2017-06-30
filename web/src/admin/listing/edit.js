import React from 'react';
import { connect } from 'react-redux';
import {
  performUpdateListingDetails
} from '../../actions/update-listing-details';
import { BackToPage } from '../../chrome/link';
import Full from '../../layout/full';

const FormElement = ({ id, description, value, handler }) => (
  <p>
    <label htmlFor="name">{description}</label>
    <input
      id={id}
      type="text"
      value={value || ''}
      className="input"
      onChange={handler}
    />
  </p>
);

class EditListingDetails extends React.Component {
  constructor(props) {
    super(props);
    const { details } = this.props;
    const {
      name,
      qualifier,
      genericName,
      genericNamePlural,
      unit,
      unitPlural,
      image,
      price
    } = details || {};
    this.state = {
      name,
      qualifier,
      genericName,
      genericNamePlural,
      unit,
      unitPlural,
      image,
      price
    };
  }

  updateState(e) {
    this.setState({
      [e.target.id]: e.target.value
    });
  }

  convertEmptyStringToNull(obj) {
    const objectWithConvertedValues = {};
    for (const key of Object.keys(obj)) {
      objectWithConvertedValues[key] = obj[key] === '' ? null : obj[key];
    }
    return objectWithConvertedValues;
  }

  handleUpdateItemSubmit() {
    const {
      params: { code, itemId },
      performUpdateListingDetails
    } = this.props;
    const { price, listCount, ...other } = this.state;
    const listingDetails = {
      ...other,
      price: Number(price)
    };
    performUpdateListingDetails({
      storeCode: code,
      itemId,
      details: this.convertEmptyStringToNull(listingDetails)
    });
  }

  render() {
    const {
      name,
      qualifier,
      genericName,
      genericNamePlural,
      unit,
      unitPlural,
      image,
      price
    } = this.state;
    const { params: { code } } = this.props;
    return (
      <Full
        left={<BackToPage path={`/admin/listing/${code}`} title="Listings" />}
      >
        <div className="px2 center">
          <form>
            <FormElement
              id="name"
              description="Name"
              value={name}
              handler={e => this.updateState(e)}
            />
            <FormElement
              id="qualifier"
              description="Qualifier"
              value={qualifier}
              handler={e => this.updateState(e)}
            />
            <FormElement
              id="genericName"
              description="Category"
              value={genericName}
              handler={e => this.updateState(e)}
            />
            <FormElement
              id="genericNamePlural"
              description="Category plural"
              value={genericNamePlural}
              handler={e => this.updateState(e)}
            />
            <FormElement
              id="unit"
              description="Unit"
              value={unit}
              handler={e => this.updateState(e)}
            />
            <FormElement
              id="unitPlural"
              description="Unit plural"
              value={unitPlural}
              handler={e => this.updateState(e)}
            />
            <FormElement
              id="image"
              description="Image"
              value={image}
              handler={e => this.updateState(e)}
            />
            <FormElement
              id="price"
              description="Price (p)"
              value={`${price || ''}`}
              handler={e => this.updateState(e)}
            />
            <button
              type="button"
              className="btn btn-primary btn-big center mt2 h3"
              onClick={() => this.handleUpdateItemSubmit()}
            >
              Save
            </button>
          </form>
        </div>
      </Full>
    );
  }
}

const mapStateToProps = ({ admin }, { params: { itemId } }) => {
  const listings = admin.listings || [];
  const listing = listings.find(({ id }) => id === itemId);
  return {
    details: listing
  };
};

export default connect(mapStateToProps, { performUpdateListingDetails })(
  EditListingDetails
);