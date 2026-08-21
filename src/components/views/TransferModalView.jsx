import TransferModal from "../modals/TransferModal";

export default function TransferModalView(props) {
  if (!props.showTransfer) return null;
  return <TransferModal {...props} />;
}
