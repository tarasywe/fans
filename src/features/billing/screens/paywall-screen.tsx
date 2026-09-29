import { billingProvider } from '../providers';
import { NativePaywall } from './native-paywall';
import { SimplePaywall } from './simple-paywall';

export function PaywallScreen() {
  return billingProvider.hasNativePaywall ? <NativePaywall /> : <SimplePaywall />;
}
