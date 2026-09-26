import { render, screen } from '@testing-library/react-native';

import { OlderMessagesIndicator } from '../components/older-messages-indicator';

describe('OlderMessagesIndicator', () => {
  it('shows a loader while the next batch is loading', async () => {
    await render(<OlderMessagesIndicator isLoading hasMore />);
    expect(screen.getByTestId('loading-older-messages')).toBeTruthy();
    expect(screen.getByText('Loading earlier messages…')).toBeTruthy();
  });

  it('marks the beginning of the conversation when nothing is left', async () => {
    await render(<OlderMessagesIndicator isLoading={false} hasMore={false} />);
    expect(screen.getByTestId('conversation-start')).toBeTruthy();
  });

  it('renders nothing between loads', async () => {
    await render(<OlderMessagesIndicator isLoading={false} hasMore />);
    expect(screen.queryByTestId('loading-older-messages')).toBeNull();
    expect(screen.queryByTestId('conversation-start')).toBeNull();
  });
});
