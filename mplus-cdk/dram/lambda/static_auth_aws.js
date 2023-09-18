'use strict';

exports.handler = (event, context, callback) => {

    // Configure authentication
    // TODO : WARNING- changing the usr/pwd may require a stack destroy/deploy as cdk is not recognizing the file change
    const authUser = 'yamaha-motors';
    const authUser2 = 'yamaha-motor';
    const authPass = '737LFaU.z7Agsc4nKR';

    // Construct the Basic Auth string
    const authString = 'Basic ' + new Buffer(authUser + ':' + authPass).toString('base64');
    const authString2 = 'Basic ' + new Buffer(authUser2 + ':' + authPass).toString('base64');

    // Get request and request headers
    const request = event.Records[0].cf.request;
    const headers = request.headers;

    // Require Basic authentication
    if (typeof headers.authorization == 'undefined' || (headers.authorization[0].value !== authString && headers.authorization[0].value !== authString2)) {
        const body = 'Unauthorized';
        const response = {
            status: '401',
            statusDescription: 'Unauthorized',
            body: body,
            headers: {
                'www-authenticate': [{key: 'WWW-Authenticate', value:'Basic'}]
            },
        };
        callback(null, response);
    }

    // Continue request processing if authentication passed
    callback(null, request);
};
