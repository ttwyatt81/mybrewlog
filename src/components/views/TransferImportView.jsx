import TransferModal from "../modals/TransferModal";

export default function TransferImportView(props) {
  if (!props.showTransfer) return null;
  return <TransferModal {...props} />;
}
