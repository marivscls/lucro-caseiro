import { Badge, Input, spacing } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { Pressable, View } from "react-native";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  max?: number;
}

export function TagInput({ tags, onChange, max = 10 }: Readonly<TagInputProps>) {
  const [input, setInput] = useState("");

  function addTag() {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (trimmed.length > 50) return;
    if (tags.length >= max) return;
    if (tags.includes(trimmed)) return;

    onChange([...tags, trimmed]);
    setInput("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleChangeText(text: string) {
    if (text.endsWith(",") || text.endsWith("\n")) {
      setInput(text.slice(0, -1));
      addTag();
    } else {
      setInput(text);
    }
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <Input
        label={`Tags (${tags.length}/${max})`}
        placeholder="Digite e pressione virgula para adicionar..."
        value={input}
        onChangeText={handleChangeText}
        onSubmitEditing={addTag}
        editable={tags.length < max}
      />

      {tags.length > 0 && (
        <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
          {tags.map((tag) => (
            <Pressable key={tag} onPress={() => removeTag(tag)}>
              <Badge label={`${tag} ✕`} variant="lavender" />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
