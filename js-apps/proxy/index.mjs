import { serve } from "@hono/node-server";
import { Hono } from "hono";
const app = new Hono();
export const PORT = process.env.NODE_ENV === "production" ? 8001 : 8001;
app.all("*", proxy);
export async function proxy(c) {

  const originalRequest = c.req.raw;
  const newUrl = getNewUrlWithNewOrigin(c.req.url);
  console.log('newUrl',newUrl)

  const clonedRequest = originalRequest.clone();
  clonedRequest.headers.delete("keep-alive");
  clonedRequest.headers.delete("connection");

  const newRequest = new Request(newUrl, clonedRequest);
  newRequest.headers.delete("x-original-origin");
  // delete  other headers
  newRequest.headers.delete("host");
  // remove Postman-Token
  newRequest.headers.delete("postman-token");
  // delete keep-alive
  newRequest.headers.delete("connection");
  newRequest.headers.delete("keep-alive");
  console.log(newRequest.headers)

  const response = await fetch(newRequest);
  // console.log("response", response);

  // return fetch(newRequest);
  // return new Response("hello");
  let body = "";
  if (response.body) {
    body = await response.text();
  }
  // remove connection
  return c.text(body, response.status, {
    "content-type":
      (response.headers.get("content-type") ) || "text/html",
  });
}

function getNewUrlWithNewOrigin(oldUrl) {
  // 创建原始 URL 对象
  const originalUrl = new URL(oldUrl);

  // 获取 _host 参数
  const hostParam = originalUrl.searchParams.get('_host');
  if (!hostParam) {
    throw new Error('Missing _host parameter');
  }

  // 生成新 origin
  const newOrigin = /^https?:\/\//i.test(hostParam)
    ? hostParam
    : `https://${hostParam}`;

  // 删除 _host 参数
  originalUrl.searchParams.delete('_host');

  // 构造新 URL
  const newUrl = new URL(newOrigin);

  // 复制路径、查询和哈希
  newUrl.pathname = originalUrl.pathname;
  newUrl.search = originalUrl.searchParams.toString(); // 注意这里是字符串
  newUrl.hash = originalUrl.hash;

  return newUrl.toString();
}
console.log(`server start at http://localhost:${PORT}`);
export function createServer(listeningListener) {
  const server = serve(
    {
      hostname: "0.0.0.0",
      fetch: app.fetch,
      port: PORT,
    },
    listeningListener,
  );
  return server;
}
createServer()
