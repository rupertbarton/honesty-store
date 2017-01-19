import HTTPStatus = require('http-status');

// generic to allow callers to assert the type of what's being sent back
export const promiseResponse = <T>(promise: Promise<T>, response, httpErrorCode = HTTPStatus.OK) => {
    promise
        .then((result: T) => {
            response.status(HTTPStatus.OK)
                .json({ response: result });
        })
        .catch((error) => {
            response.status(httpErrorCode)
                .json({ error: { message: error.message }});
        });
};
