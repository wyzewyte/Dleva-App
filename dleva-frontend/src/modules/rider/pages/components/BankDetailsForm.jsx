import PaystackBankAccountForm from '../../../../components/payments/PaystackBankAccountForm';

const BankDetailsForm = (props) => (
  <PaystackBankAccountForm
    {...props}
    title="Bank details"
    description="Choose a bank, enter the account number, and we will verify it with Paystack before saving."
    saveLabel="Save verified bank details"
  />
);

export default BankDetailsForm;
