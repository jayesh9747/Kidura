import axios from "axios";

export const axiosInstance = axios.create({
  withCredentials: true,
});


export const apiConnector = (method, url, bodyData, headers = {}, params) => {
  console.log("this is url", url);

  return axiosInstance({
      method: method,
      url: url,
      data: bodyData ? bodyData : null,
      headers: {
          "Content-Type": "application/json",
          ...headers
      },
      params: params ? params : null,
  });
};
