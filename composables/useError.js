export default function useError() {

  const errorBag = useState('error-Bag', () => ({}));

  const transformValidationErrors = (response, handlerType = 'axios') => {
    if (handlerType === 'axios' && response && response.data && response.data.errors) {
      response.data.errors.forEach(error => {
        errorBag.value[error.field] = error.message;
      });
    }
  };
function resetErrorBag (){
  errorBag.value = {};
}
  return {
    errorBag,
    transformValidationErrors,
    resetErrorBag
  };
}
