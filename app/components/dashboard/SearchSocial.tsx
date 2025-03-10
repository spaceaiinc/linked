// App.tsx
import React, { useState } from 'react'

interface SearchResult {
  title: string
  link: string
  snippet: string
  source: string
}

export const SearchSocial = () => {
  const [query, setQuery] = useState<string>('')
  const [socialNetworks, setSocialNetworks] = useState<string[]>([
    'twitter.com',
    'facebook.com',
    'instagram.com',
    'linkedin.com',
    'tiktok.com',
  ])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [error, setError] = useState<string | null>(null)

  // このアプリは実際のGoogle検索APIを使用します
  // 実際の実装では、Google Custom Search APIのキーが必要です
  const searchSocialNetworks = async () => {
    if (!query.trim()) {
      setError('検索語を入力してください')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // 実際のアプリでは、以下のようなエンドポイントをバックエンドで用意し、
      // Google Custom Search APIを使用して検索を行います
      const sites = socialNetworks
        .filter((network) => {
          const element = document.getElementById(network)
          // HTMLInputElementとして型付け
          return element && (element as HTMLInputElement).checked
        })
        .map((network) => `site:${network}`)
        .join(' OR ')

      // この部分は実際のAPIコールに置き換える必要があります
      // const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&sites=${encodeURIComponent(sites)}`);
      // const data = await response.json();

      // デモ用にモックデータを返します
      // 実際のアプリではこの部分を削除してください
      const mockResults = generateMockResults(query, socialNetworks)
      setTimeout(() => {
        setResults(mockResults)
        setIsLoading(false)
      }, 1000)
    } catch (err) {
      setError('検索中にエラーが発生しました。もう一度お試しください。')
      setIsLoading(false)
    }
  }

  // モックデータを生成する関数（デモ用）
  // 実際のアプリでは削除してください
  const generateMockResults = (
    name: string,
    networks: string[]
  ): SearchResult[] => {
    const checkedNetworks = networks.filter((network) => {
      const element = document.getElementById(network)
      // HTMLInputElementとして型付け
      return element && (element as HTMLInputElement).checked
    })

    return checkedNetworks.flatMap((network) => {
      const results: SearchResult[] = []
      for (let i = 0; i < 3; i++) {
        const source = network.split('.')[0]
        results.push({
          title: `${name} - ${source.charAt(0).toUpperCase() + source.slice(1)}`,
          link: `https://${network}/profile/${name.replace(' ', '_').toLowerCase()}${i}`,
          snippet: `${name}さんの${source}プロフィールです。${source}で最新の投稿をチェックしましょう。`,
          source: source,
        })
      }
      return results
    })
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 text-center">SNS検索アプリ</h1>

      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <div className="mb-4">
          <label htmlFor="query" className="block mb-2 font-medium">
            検索したい人名:
          </label>
          <input
            id="query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="例: 山田太郎"
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="mb-4">
          <p className="font-medium mb-2">検索対象のSNS:</p>
          <div className="flex flex-wrap gap-4">
            {socialNetworks.map((network) => (
              <div key={network} className="flex items-center">
                <input
                  type="checkbox"
                  id={network}
                  defaultChecked
                  className="mr-2"
                />
                <label htmlFor={network}>
                  {network.split('.')[0].charAt(0).toUpperCase() +
                    network.split('.')[0].slice(1)}
                </label>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={searchSocialNetworks}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:bg-blue-300"
        >
          {isLoading ? '検索中...' : '検索'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            検索結果 ({results.length}件)
          </h2>
          <div className="space-y-6">
            {results.map((result, index) => (
              <div key={index} className="border-b pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-gray-200 text-xs px-2 py-1 rounded">
                    {result.source}
                  </span>
                  <h3 className="text-lg font-medium text-blue-600">
                    <a
                      href={result.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {result.title}
                    </a>
                  </h3>
                </div>
                <p className="text-gray-700">{result.snippet}</p>
                <p className="text-sm text-gray-500 mt-1">{result.link}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
