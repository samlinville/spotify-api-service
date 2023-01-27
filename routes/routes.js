require("dotenv").config();
const querystring = require("node:querystring");

const NOW_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing`;
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const refresh_token = process.env.REFRESH_TOKEN;

const appRouter = function (app) {
  app.get("/spotify/current", async function (req, res) {
    var nowPlaying = await getNowPlayingItem(
      client_id,
      client_secret,
      refresh_token
    );
    if (nowPlaying !== false) {
      res.status(200).send({ message: nowPlaying });
    }
      res.status(400).send({ message: "No music playing" });
  });
};

const getAccessToken = async () => {
  const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: querystring.stringify({
      grant_type: "refresh_token",
      refresh_token,
    }),
  });
  return response.json();
};

const getNowPlaying = async (client_id, client_secret, refresh_token) => {
  const { access_token } = await getAccessToken(
    client_id,
    client_secret,
    refresh_token
  );

  return fetch(NOW_PLAYING_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
};

async function getNowPlayingItem(client_id, client_secret, refresh_token) {
  const response = await getNowPlaying(client_id, client_secret, refresh_token);
  if (response.status === 204 || response.status > 400) {
    return false;
  }

  const song = await response.json();
  const albumImageUrl = song.item.album.images[0].url;
  const artist = song.item.artists.map((_artist) => _artist.name).join(", ");
  const isPlaying = song.is_playing;
  const songUrl = song.item.external_urls.spotify;
  const title = song.item.name;

  return {
    albumImageUrl,
    artist,
    isPlaying,
    songUrl,
    title,
  };
}

module.exports = appRouter;
