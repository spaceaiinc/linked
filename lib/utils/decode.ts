/**
 * 文字列内のURLエンコードされた日本語部分のみをデコードする関数
 * @param {string} text - デコードする文字列
 * @return {string} - 日本語部分のみデコードされた文字列
 */
export function decodeJapaneseOnly(text: string): string {
  // URLエンコードパターンを検出する正規表現
  // %から始まる16進数のシーケンスを探す
  const encodedPattern = /%[0-9A-F]{2}(%[0-9A-F]{2})+/gi

  return text.replace(encodedPattern, (match) => {
    try {
      // デコードしてみる
      const decoded = decodeURIComponent(match)

      // デコードした結果が日本語かどうか確認
      // 日本語の文字コード範囲を定義（ひらがな、カタカナ、漢字など）
      const japaneseRegex =
        /^[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\uFF00-\uFFEF]+$/

      // 日本語の場合はデコード結果を返し、そうでなければ元の文字列を返す
      return japaneseRegex.test(decoded) ? decoded : match
    } catch (e) {
      // デコードに失敗した場合は元の文字列を返す
      console.error('デコードに失敗しました:', e)
      return match
    }
  })
}
