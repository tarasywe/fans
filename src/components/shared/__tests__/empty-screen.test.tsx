import { render, screen } from '@testing-library/react-native';

import { EmptyScreen } from '../empty-screen';

describe('EmptyScreen', () => {
  it('renders the title and description', async () => {
    await render(<EmptyScreen testID="empty" title="Chats" description="Nothing yet" />);
    expect(screen.getByTestId('empty')).toBeTruthy();
    expect(screen.getByText('Chats')).toBeTruthy();
    expect(screen.getByText('Nothing yet')).toBeTruthy();
  });

  it('omits the description when not provided', async () => {
    await render(<EmptyScreen title="Feed" />);
    expect(screen.getByText('Feed')).toBeTruthy();
    expect(screen.queryByText('Nothing yet')).toBeNull();
  });
});
