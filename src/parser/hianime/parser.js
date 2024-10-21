import { fetchFromApi, fetchSources, interceptor } from "../../axios/interceptor";
import { extractListPage } from "../../extractor/hianime/list_page";
import { extractHomePage } from "../../extractor/hianime/home_page";
import { extractInfoPage } from "../../extractor/hianime/info_page";
import { setResponse, setError } from "../../helper/response";
import { extractEpisodes } from "../../extractor/hianime/episode_page";
import { extractServers } from "../../extractor/hianime/servers";
import { extractSource } from "../../extractor/hianime/episode_sources";

export const getHomePage = async (c) => {
   try {
      const obj = await interceptor("/home");

      if (!obj.status) {
         return setError(c, 400, "make sure given endpoint is correct");
      }

      const response = extractHomePage(obj.data);

      return setResponse(c, 200, response);
   } catch (error) {
      console.log(error.message);

      return setError(c, 500, "something went wrong");
   }
};

export const getInfo = async (c) => {
   try {
      const id = c.req.param("id");
      console.log(id);
      const obj = await interceptor(`/${id}`);
      if (!obj.status) {
         return setError(c, 400, "make sure given endpoint is correct");
      }
      const response = extractInfoPage(obj.data);

      return setResponse(c, 200, response);
   } catch (error) {
      console.log(error.message);

      return setError(c, 500, "something went wrong");
   }
};

export const getListPage = async (c) => {
   try {
      const validateQueries = [
         "top-airing",
         "most-popular",
         "most-favorite",
         "completed",
         "recently-added",
         "recently-updated",
         "top-upcoming",
         "genre",
         "az-list",
      ];
      let query = c.req.param("query") || null;
      query = query ? query.toLowerCase() : query;

      if (!query && !validateQueries.includes(query)) return setError(c, 404, "invalid query");

      const category = c.req.param("category") || null;
      const page = c.req.query("page") || 1;
      const endpoint = category ? `/${query}/${category}?page=${page}` : `/${query}?page=${page}`;

      const obj = await interceptor(endpoint);

      if (!obj.status) {
         return setError(c, 400, "make sure given endpoint is correct");
      }
      const response = extractListPage(obj.data);

      if (response.response.length < 1) return setError(c, 404, "page not found");
      return setResponse(c, 200, response);
   } catch (error) {
      console.log(error.message);
      return setError(c, 500, "something went wrong");
   }
};

export const getSearchPage = async (c) => {
   try {
      const keyword = c.req.query("keyword") || null;
      const page = c.req.query("page") || 1;

      if (!keyword) return setError(c, 404, "query is required");

      const endpoint = `/search?keyword=${keyword.toLowerCase().replace(" ", "+")}&page=${page}`;
      const obj = await interceptor(endpoint);

      if (!obj.status) {
         return setError(c, 400, "make sure given endpoint is correct");
      }
      const response = extractListPage(obj.data);

      return setResponse(c, 200, response);
   } catch (error) {
      console.log(error.message);
      return setError(c, 500, "something went wrong");
   }
};

export const getEpisodes = async (c) => {
   try {
      const id = c.req.param("id");

      if (!id) return setError(c, 400, "id is required");

      const Referer = `/watch/${id}`;

      const idNum = id.split("-").at(-1);
      const obj = await fetchFromApi(Referer, `/ajax/v2/episode/list/${idNum}`);

      if (!obj.status) {
         return setError(c, 400, "make sure given endpoint is correct");
      }
      const response = extractEpisodes(obj.data);

      return setResponse(c, 200, response);
   } catch (error) {
      console.log(error.message);
      return setError(c, 500, "something went wrong");
   }
};

export const getServers = async (c) => {
   try {
      const episodeId = c.req.query("episodeId");

      if (!episodeId) return setError(c, 400, "episodeId is required");

      const episode = episodeId.split("ep=").at(-1);

      const obj = await fetchFromApi(episodeId, `/ajax/v2/episode/servers?episodeId=${episode}`);

      if (!obj.status) {
         return setError(c, 400, "make sure given endpoint is correct");
      }
      const response = extractServers(obj.data);

      return setResponse(c, 200, response);
   } catch (error) {
      console.log(error.message);
      return setError(c, 500, "something went wrong");
   }
};
export const getSources = async (c) => {
   try {
      const { episodeId, server = 4, audio = "sub" } = c.req.query();

      console.log(episodeId, server, audio);

      const validServerIndexes = [4, 1];

      const integerIndex = Number(server);

      if (!validServerIndexes.includes(integerIndex)) return setError(c, 400, "invalid server");

      if (!episodeId) return setError(c, 400, "episodeId is required");

      const serverIdsHTML = await fetchFromApi(
         episodeId,
         `/ajax/v2/episode/servers?episodeId=${episodeId.split("ep=").at(-1)}`
      );

      const serverIds = extractServers(serverIdsHTML.data);

      const selectedServer = serverIds[audio].find((el) => el.index === integerIndex);

      const obj = await fetchSources(episodeId, `/ajax/v2/episode/sources?id=${selectedServer.id}`);

      if (!obj.status) {
         return setError(c, 400, "make sure given endpoint is correct");
      }

      const response = await extractSource(obj.data, audio, episodeId, server);
      return setResponse(c, 200, response);
   } catch (error) {
      console.log(error.message);
      return setError(c, 500, "something went wrong");
   }
};

//  1) get the episode id from episode list     -->              /ajax/v2/episode/list/${idNum}
//  2) get the servers by episode id given by episode list   --> /ajax/v2/episode/servers?episodeId=${episodeId}
//  3) get the source url by serverId given by servers        --> /ajax/v2/episode/sources?id=${serverId}
