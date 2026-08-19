import { useState } from "react";
import * as ImagePicker from "expo-image-picker";

import { showAlert } from "../components/alert-store";

export type PickImageOptions = Readonly<{
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}>;

export function useImagePicker() {
  const [imageUri, setImageUri] = useState<string | null>(null);

  async function pickFromGalleryAsset(options: PickImageOptions = {}) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (String(status) !== "granted") {
      showAlert({
        title: "Permissao necessária",
        message: "Precisamos de acesso a sua galeria para selecionar uma foto.",
      });
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: options.allowsEditing ?? true,
      aspect: options.aspect ?? [1, 1],
      quality: options.quality ?? 0.7,
      allowsMultipleSelection: false,
      exif: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      return asset;
    }
    return null;
  }

  async function pickFromGallery(options?: PickImageOptions) {
    return (await pickFromGalleryAsset(options))?.uri ?? null;
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (String(status) !== "granted") {
      showAlert({
        title: "Permissao necessária",
        message: "Precisamos de acesso a camera para tirar uma foto.",
      });
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
    showAlert({
      title: "Adicionar foto",
      message: "Como você quer adicionar a foto?",
      buttons: [
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
      ],
    });
  }

  function clear() {
    setImageUri(null);
  }

  return {
    imageUri,
    setImageUri,
    showPicker,
    pickFromGallery,
    pickFromGalleryAsset,
    takePhoto,
    clear,
  };
}
