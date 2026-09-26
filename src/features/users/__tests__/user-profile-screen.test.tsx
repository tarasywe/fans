import { installTestMocks, renderWithQuery } from '@test/test-utils';
import { fireEvent, screen } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { UserProfileScreen } from '../screens/user-profile-screen';

jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));

beforeAll(installTestMocks);

describe('UserProfileScreen', () => {
  it('shows the fan details for the user in the route', async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ userId: 'u_1' });
    await renderWithQuery(<UserProfileScreen />);

    expect(await screen.findByText('Ethan Shoots')).toBeTruthy();
    expect(screen.getByText('@ethan_shoots')).toBeTruthy();
    expect(screen.getByText('User BIO')).toBeTruthy();
    expect(screen.getByText('Rebill')).toBeTruthy();
  });

  it('toggles rebill locally', async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ userId: 'u_1' });
    await renderWithQuery(<UserProfileScreen />);
    const toggle = await screen.findByTestId('rebill-toggle');
    const before = toggle.props.accessibilityState.checked;

    await fireEvent.press(toggle);
    expect(screen.getByTestId('rebill-toggle').props.accessibilityState.checked).toBe(!before);
  });

  it('shows an error state for unknown users', async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ userId: 'u_missing' });
    await renderWithQuery(<UserProfileScreen />);
    expect(await screen.findByTestId('error-state')).toBeTruthy();
  });

  it('closes the modal', async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ userId: 'u_1' });
    await renderWithQuery(<UserProfileScreen />);
    await screen.findByText('Ethan Shoots');
    await fireEvent.press(screen.getByTestId('close-profile'));
    expect(router.back).toHaveBeenCalled();
  });
});
