export default function errorHandler(error) {
  return error?.response?.data
    ? { ...error.response?.data, status: error.response.status }
    : { result: "failure", records: [] };
}
