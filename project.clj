(defproject cloure-app "1.0.0-SNAPSHOT"
  :description "ClojureScript/Google Composure app"
  :dependencies [[org.clojure/clojure "1.3.0"]
                 [compojure "1.0.1"]
                 [clj-stacktrace "0.2.4"]
                 [ring/ring-core "0.3.7"]
                 [clj-http "0.3.0"]
                 [ring/ring-jetty-adapter "0.3.7"]]
  :dev-dependencies [[ring/ring-devel "0.3.7"]
                     [lein-ring "0.5.4"]
                     [ring-serve "0.1.1"]]
  :main net.kolov.jaclo.core
  :ring {:handler net.kolov.jaclo.core/app})