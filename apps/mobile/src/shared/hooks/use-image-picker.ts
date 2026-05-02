import { useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

export function useImagePicker() {
  const [imageUri, setImageUri] = useState<string | null>(null);

  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (String(status) !== "granted") {
      Alert.alert(
        "Permissao necessaria",
        "Precisamos de acesso a sua galeria para selecionar uma foto.",
      );
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      allowsMultipleSelection: false,
      exif: false,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      return uri;
    }
    return null;
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (String(status) !== "granted") {
      Alert.alert(
        "Permissao necessaria",
        "Precisamos de acesso a camera para tirar uma foto.",
      );
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      exif: false,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      return uri;
    }
    return null;
  }

  function showPicker() {
    Alert.alert("Adicionar foto", "Como voce quer adicionar a foto?", [
      {
        text: "Tirar foto",
        onPress: () => {
          takePhoto().catch(() => {});
        },
      },
      {
        text: "Escolher da galeria",
        onPress: () => {
          pickFromGallery().catch(() => {});
        },
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  function clear() {
    setImageUri(null);
  }

  return { imageUri, setImageUri, showPicker, pickFromGallery, takePhoto, clear };
}
