(ns net.kolov.jaclo.server
  (:use compojure.core
        ring.util.servlet
        [ring.middleware params session file file-info stacktrace reload]
        )
  (:require [compojure.route :as r]
            [clj-http.client :as c]
            [compojure.handler :as handler]
            [ring.adapter.jetty :as ring]
            [clojure.string :as s]
            ))

(def AJC-URL "http://service.alljavaclasses.com/search")
(defn svc-call [s] (:body (c/get s)))
(defn ajc-call [s] (svc-call (str AJC-URL s)))

(defroutes app-routes
  (GET "/search" [:as req]
    {:body (svc-call (str AJC-URL "?" (:query-string req)))})
  (GET "/req/*" [:as r] {:body (str r)})
  (r/resources "/")
  (r/not-found "<h1>Page not found</h1> <br/> Probably you want to <a href=\"/browse/maven/central\"> browse the jars and classes on maven central</a>")
  )

(defn app-reload [] (-> app-routes (handler/site)
                      (wrap-reload #'app-routes '(net.kolov.jaclo.server))
                      ))

(defservice app-routes)

(def app (handler/site app-routes))
(defonce server
  (ring/run-jetty #'app {:port 8888 :join? false}))

(defn -main [port]
  (ring/run-jetty app {:port (Integer. port)}))
                                        ; to start: (use 'ring.util.serve)
                                        ; (serve app)

