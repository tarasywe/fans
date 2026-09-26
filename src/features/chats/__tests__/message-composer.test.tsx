import { fireEvent, render, screen } from '@testing-library/react-native';

import { MessageComposer } from '../components/message-composer';
import { MESSAGE_MAX_LENGTH } from '../constants/limits';

const setup = async (maxLength?: number) => {
  const onSend = jest.fn();
  await render(<MessageComposer onSend={onSend} maxLength={maxLength} />);
  return { onSend, input: () => screen.getByTestId('message-input') };
};

const isDisabled = (testID: string) =>
  screen.getByTestId(testID).props.accessibilityState?.disabled;

describe('MessageComposer', () => {
  it('starts empty with a 0/400 counter and a disabled send button', async () => {
    await setup();
    expect(screen.getByTestId('message-counter')).toHaveTextContent(`0/${MESSAGE_MAX_LENGTH}`);
    expect(isDisabled('send-button')).toBe(true);
    expect(screen.getByTestId('message-input').props.maxLength).toBe(MESSAGE_MAX_LENGTH);
  });

  it('keeps send disabled for whitespace-only input', async () => {
    const { input } = await setup();
    await fireEvent.changeText(input(), '    ');
    expect(isDisabled('send-button')).toBe(true);
  });

  it('sends trimmed text and clears the input', async () => {
    const { onSend, input } = await setup();
    await fireEvent.changeText(input(), '  Hello there  ');
    expect(screen.getByTestId('message-counter')).toHaveTextContent('15/400');
    await fireEvent.press(screen.getByTestId('send-button'));
    expect(onSend).toHaveBeenCalledWith('Hello there');
    expect(input().props.value).toBe('');
  });

  it('inserts quick emoji', async () => {
    const { input } = await setup();
    await fireEvent.changeText(input(), 'Nice ');
    await fireEvent.press(screen.getByTestId('quick-emoji-🔥'));
    expect(input().props.value).toBe('Nice 🔥');
  });

  it('does not insert emoji past the character limit', async () => {
    const { input } = await setup(10);
    await fireEvent.changeText(input(), '123456789');
    await fireEvent.press(screen.getByTestId('quick-emoji-🔥'));
    expect(input().props.value).toBe('123456789');
  });

  it('highlights the counter at the limit', async () => {
    const { input } = await setup(5);
    await fireEvent.changeText(input(), '12345');
    expect(screen.getByTestId('message-counter')).toHaveTextContent('5/5');
  });

  it('opens the emoji picker from "…" and inserts from it', async () => {
    const { input } = await setup();
    expect(screen.queryByTestId('emoji-picker')).toBeNull();
    await fireEvent.press(screen.getByTestId('emoji-picker-toggle'));
    expect(screen.getByTestId('emoji-picker')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('emoji-category-food'));
    await fireEvent.press(screen.getByLabelText('Insert 🍕'));
    expect(input().props.value).toBe('🍕');

    await fireEvent.press(screen.getByTestId('emoji-picker-toggle'));
    expect(screen.queryByTestId('emoji-picker')).toBeNull();
  });

  it('closes the emoji picker when the input gets focus', async () => {
    const { input } = await setup();
    await fireEvent.press(screen.getByTestId('emoji-picker-toggle'));
    await fireEvent(input(), 'focus');
    expect(screen.queryByTestId('emoji-picker')).toBeNull();
  });

  it('keeps image attachment disabled for now', async () => {
    await setup();
    expect(isDisabled('attach-button')).toBe(true);
  });
});
