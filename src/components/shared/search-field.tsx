import { CloseCircleIcon, Icon, SearchIcon } from '@ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@ui/input';
import { Pressable } from '@ui/pressable';

type SearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  testID?: string;
  className?: string;
};

export function SearchField({
  value,
  onChangeText,
  placeholder,
  testID,
  className,
}: SearchFieldProps) {
  return (
    <Input className={`h-11 rounded-xl border-border bg-background ${className ?? ''}`}>
      <InputSlot>
        <InputIcon as={SearchIcon} className="h-5 w-5 text-muted-foreground" />
      </InputSlot>
      <InputField
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColorClassName="accent-muted-foreground"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel={placeholder}
        className="text-base"
        testID={testID}
      />
      {value ? (
        // Not an InputSlot: slots are hidden from screen readers, this is a real button.
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={() => onChangeText('')}
          hitSlop={8}
          testID={testID ? `${testID}-clear` : undefined}
        >
          <Icon as={CloseCircleIcon} className="h-4 w-4 text-muted-foreground" />
        </Pressable>
      ) : null}
    </Input>
  );
}
