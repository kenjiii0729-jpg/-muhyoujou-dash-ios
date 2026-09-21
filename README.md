# 無表情ダッシュ

6歳くらいの子どもが描いたような、白い手描き世界を無表情な恐竜が走るエンドレスランゲームです。

## ゲーム内容

- 画面タップでジャンプ、空中でもう一度タップすると2段ジャンプ
- 石、穴、川を飛び越える
- 坂道と崖を走る
- 時間とともに少しずつスピードアップ
- ハイスコアを端末内に保存
- 縦画面・横画面の両方に対応

## iPhoneで試す方法

1. iPhoneに **Expo Go** をインストール
2. パソコンまたはクラウド開発環境で `npm install`
3. `npx expo start --tunnel` を実行
4. 表示されたQRコードをiPhoneで読み取る

## App Store向けビルド

MacがなくてもExpoのクラウドビルドを利用できます。

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios
```

App Storeへの公開にはApple Developer Programへの登録が必要です。
