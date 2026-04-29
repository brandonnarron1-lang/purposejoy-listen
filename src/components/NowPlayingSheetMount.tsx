import NowPlayingSheet from './NowPlayingSheet';
import { useSheet } from '../context/SheetContext';

export default function NowPlayingSheetMount() {
  const { isOpen, close } = useSheet();
  return <NowPlayingSheet isOpen={isOpen} onClose={close} />;
}
