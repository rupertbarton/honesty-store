import { browserHistory } from 'react-router';
import { apifetch, unpackJson } from './apirequest';

export const SIGNIN2_REQUEST = 'SIGNIN2_REQUEST';
export const SIGNIN2_SUCCESS = 'SIGNIN2_SUCCESS';
export const SIGNIN2_FAILURE = 'SIGNIN2_FAILURE';

const signin2Request = () => {
  return {
    type: SIGNIN2_REQUEST,
  };
};

const signin2Success = (response) => {
  return {
    type: SIGNIN2_SUCCESS,
    response
  };
};

const signin2Failure = () => {
  return {
    type: SIGNIN2_FAILURE
  };
};

export const performSignin2 = ({ emailToken }) => async (dispatch, getState) => {
  dispatch(signin2Request());

  try {
    const response = await apifetch({
      url: '/api/v1/signin2',
      token: emailToken,
      body: {}
    });

    dispatch(signin2Success(await unpackJson(response)));
    browserHistory.push(`/store`);

  } catch (e) {
    dispatch(signin2Failure());
    browserHistory.push(`/error`);
  }
};
