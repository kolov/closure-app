(defproject cloure-app "1.0.0-SNAPSHOT"
  :description "ClojureScript/Google Composure app"
  :dependencies [[org.clojure/clojure "1.3.0"]
                 [compojure "1.0.1"]
                 [clj-stacktrace "0.2.4"]
                 [ring/ring-core "1.0.2"]
                 [clj-http "0.3.0"]
                 [ring/ring-jetty-adapter "1.0.2"]]
  :dev-dependencies [[ring/ring-devel "1.0.2"]
                     [lein-ring "0.5.4"]
                     [ring-serve "0.1.1"]]
  :main net.kolov.jaclo.server
  :ring {:handler net.kolov.jaclo.core/app})
