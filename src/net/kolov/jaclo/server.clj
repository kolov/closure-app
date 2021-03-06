(ns net.kolov.jaclo.server
  (:use compojure.core
          [ring.util.response :only (file-response resource-response status)]
        ring.util.servlet
        [ring.middleware params session file file-info]
        )
  (:require [compojure.route :as r]
            [clj-http.client :as c]
            [compojure.handler :as handler]
            [ring.adapter.jetty :as ring]
            [clojure.string :as s]
            ))

(def AJC-URL "http://localhost:8080/service") ;"http://service.alljavaclasses.com")
(defn svc-call [s] (:body (c/get s)))

(defroutes app-routes
  (GET "/search" [:as req]
    {:body (svc-call (str AJC-URL "/search?" (:query-string req)))})
  (GET "/list/*" [:as req]
    {:body (svc-call (str AJC-URL (:uri req)))})
  (GET "/searchFamilies" [:as req]
    {:body (svc-call (str AJC-URL "/searchFamilies?" (:query-string req)))})
  (GET "/searchLibs" [:as req]
    {:body (svc-call (str AJC-URL "/searchLibs?" (:query-string req)))})
  (GET "/req/*" [:as r] {:body (str r)})
  (GET "/view" [] (resource-response "public/view.html"))
  (GET "/view/*" [] (resource-response "public/view.html"))
  (r/resources "/")
  (r/not-found "<h1>Page not found</h1> <br/> Try <a href=\"/search.html\">search.html</a>")
  )

;(defn app-reload [] (-> app-routes (handler/site)
;                      (wrap-reload #'app-routes '(net.kolov.jaclo.server))
;                      ))

(defservice app-routes)

(def app (handler/site app-routes))
;(defonce server  (ring/run-jetty #'app {:port 8888 :join? false}))
; to start: (use 'ring.util.serve)
; (serve app)

(defn -main [port]
  (ring/run-jetty app {:port (Integer. port)}))
               
