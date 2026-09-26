import { Text } from '@ui/text';
import { useRef, useState } from 'react';
import { Keyboard, TextInput, View } from 'react-native';
import { IconButton } from '@/components/shared/icon-button';
import { PlusCircleIcon, SendIcon } from '@/components/shared/icons';

import { MESSAGE_MAX_LENGTH } from '../constants/limits';
import { appendWithLimit } from '../utils/message-format';
import { EmojiPicker } from './emoji-picker';
import { EmojiQuickBar } from './emoji-quick-bar';

type MessageComposerProps = {
  onSend: (text: string) => void;
  isSending?: boolean;
  maxLength?: number;
};

export function MessageComposer({
  onSend,
  isSending = false,
  maxLength = MESSAGE_MAX_LENGTH,
}: MessageComposerProps) {
  const [text, setText] = useState('');
  const [isPickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const canSend = text.trim().length > 0 && !isSending;
  const atLimit = text.length >= maxLength;

  const insertEmoji = (emoji: string) =>
    setText((current) => appendWithLimit(current, emoji, maxLength));

  const togglePicker = () => {
    if (isPickerOpen) {
      setPickerOpen(false);
      inputRef.current?.focus();
    } else {
      Keyboard.dismiss();
      setPickerOpen(true);
    }
  };

  const send = () => {
    if (!canSend) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <View className="bg-background" testID="message-composer">
      <View
        className={`gap-2 border-t border-border px-4 pt-2 ${isPickerOpen ? 'pb-2' : 'pb-safe-offset-2'}`}
      >
        <EmojiQuickBar
          onSelect={insertEmoji}
          isPickerOpen={isPickerOpen}
          onTogglePicker={togglePicker}
        />

        <View className="flex-row items-end gap-2">
          <View className="min-h-12 flex-1 flex-row items-center gap-2 rounded-2xl border border-border bg-background px-3 py-1.5">
            <IconButton
              icon={PlusCircleIcon}
              accessibilityLabel="Attach image (coming soon)"
              disabled
              className="h-8 w-8"
              iconClassName="text-muted-foreground"
              testID="attach-button"
            />
            <TextInput
              ref={inputRef}
              value={text}
              onChangeText={setText}
              onFocus={() => setPickerOpen(false)}
              placeholder="Start typing..."
              placeholderTextColorClassName="accent-muted-foreground"
              maxLength={maxLength}
              multiline
              accessibilityLabel="Message"
              className="max-h-28 flex-1 py-1.5 text-base text-foreground"
              testID="message-input"
            />
          </View>
          <IconButton
            icon={SendIcon}
            variant="primary"
            accessibilityLabel="Send message"
            onPress={send}
            disabled={!canSend}
            className="h-12 w-12"
            testID="send-button"
          />
        </View>

        <Text
          className={`text-xs ${atLimit ? 'text-destructive' : 'text-muted-foreground'}`}
          accessibilityLabel={`${text.length} of ${maxLength} characters`}
          testID="message-counter"
        >
          {text.length}/{maxLength}
        </Text>
      </View>

      {isPickerOpen ? <EmojiPicker onSelect={insertEmoji} /> : null}
    </View>
  );
}
