import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { BRAND_LIGHT, LIGHT_TEXT, MUTED_TEXT, DANGER, LIGHT_BACKGROUND } from '../chrome/colors';
import Page from '../chrome/page';
import './index.css';

const Profile = ({ params: { storeId }, emailAddress }) => (
  <Page title="Profile"
    storeId={storeId}>
    <div>
      <div className="profile-badge" style={{ borderColor: MUTED_TEXT, background: LIGHT_BACKGROUND }}>
        <div className="profile-badge-image" style={{ background: BRAND_LIGHT, color: LIGHT_TEXT }}>HJ</div>
        <div className="profile-badge-details">
          <div className="profile-badge-details-name">Honest Jo</div>
          <div className="profile-badge-details-email">{emailAddress}</div>
        </div>
        <div className="profile-badge-action">
          <Link to={`/${storeId}/profile/edit`}>Edit</Link>
        </div>
      </div>
      <ul className="profile-info" style={{ borderColor: MUTED_TEXT, color: BRAND_LIGHT, background: LIGHT_BACKGROUND }}>
        <li style={{ borderColor: MUTED_TEXT }}><Link to={`/${storeId}/info/about`}>About honesty.store</Link></li>
        <li style={{ borderColor: MUTED_TEXT }}><Link to={`/${storeId}/info/terms`}>Terms &amp; Conditions</Link></li>
        <li style={{ borderColor: MUTED_TEXT }}><Link to={`/${storeId}/info/privacy`}>Privacy Policy</Link></li>
        <li style={{ borderColor: MUTED_TEXT }}><Link to={`/${storeId}/info/app`}>App Version</Link></li>
      </ul>
      <ul className="profile-actions" style={{ borderColor: MUTED_TEXT, color: DANGER, background: LIGHT_BACKGROUND }}>
        <li style={{ borderColor: MUTED_TEXT }}><Link to={`/${storeId}/profile/logout`}>Log Out</Link></li>
        <li style={{ borderColor: MUTED_TEXT }}><Link to={`/${storeId}/profile/close`}>Close Account</Link></li>
      </ul>
    </div>
  </Page>
);


const mapStateToProps = ({ pending, user: { emailAddress } }) => ({
  loading: pending.length > 0,
  emailAddress
});

export default connect(mapStateToProps)(Profile);