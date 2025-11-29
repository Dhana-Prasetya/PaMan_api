const response = (res, result, status, message) => { // Standard response format

    const resultPrint = {
        status: 'Success',
        statusCode: status,
        data: result,
        message: message || null,
    };

    res.status(status).json(resultPrint);

};

module.exports = { response };