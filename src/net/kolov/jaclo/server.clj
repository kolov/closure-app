(ns net.kolov.jaclo.server
  (:use compojure.core
        ring.util.servlet
        [ring.middleware params session file file-info ]
        )
  (:require [compojure.route :as r]
            [clj-http.client :as c]
            [compojure.handler :as handler]
            [ring.adapter.jetty :as ring]
            [clojure.string :as s]
            ))

(def AJC-URL "http://service.alljavaclasses.com")
(defn svc-call [s] (:body (c/get s)))
(defn ajc-call [s] (svc-call (str AJC-URL s)))

(defroutes app-routes
  (GET "/search" [:as req]
    {:body (svc-call (str AJC-URL "/search?" (:query-string req)))})
 (GET "/list/*" [:as req]
    {:body (svc-call (str AJC-URL (:uri req)))})
  (GET "/req/*" [:as r] {:body (str r)})
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
               
