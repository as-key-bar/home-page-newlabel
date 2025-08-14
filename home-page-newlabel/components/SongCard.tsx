import { Song } from '../app/api/songs/route'

interface SongCardProps {
  song: Song
}

export default function SongCard({ song }: SongCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          {song.title}
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {song.duration}
        </span>
      </div>
      
      <p className="text-gray-600 dark:text-gray-300 mb-2">
        {song.artist} • {song.album}
      </p>
      
      <p className="text-gray-700 dark:text-gray-200 mb-3">
        {song.description}
      </p>
      
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs">
          {song.genre}
        </span>
        {song.tags.split(',').map((tag, index) => (
          <span
            key={index}
            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs"
          >
            {tag.trim()}
          </span>
        ))}
      </div>
      
      {song.originalTracks && (
        <div className="mb-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold">原曲:</span> {song.originalTracks}
          </p>
        </div>
      )}
      
      <div className="flex gap-2">
        {song.streamingUrl && (
          <a
            href={song.streamingUrl}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            試聴
          </a>
        )}
        {song.downloadUrl && (
          <a
            href={song.downloadUrl}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            ダウンロード
          </a>
        )}
      </div>
      
      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        リリース日: {song.releaseDate}
      </div>
    </div>
  )
}