(defproject cloure-app "1.0.0-SNAPSHOT"
  :description "ClojureScript/Google Composure app"
  :dependencies [[org.clojure/clojure "1.3.0"]
                 [compojure "1.0.1"]
                 [clj-stacktrace "0.2.4"]
                 [ring/ring-core "1.1.0-SNAPSHOT"]
                 [clj-http "0.3.0"]
                 [jayq "0.1.0-SNAPSHOT"]
                 [ring/ring-jetty-adapter "1.1.0-SNAPSHOT"]]
  :dev-dependencies [[ring/ring-devel "1.1.0-SNAPSHOT"]
                     [lein-ring "0.5.4"]
                     [ring-serve "0.1.1"]]
  :main net.kolov.jaclo.server
  :ring {:handler net.kolov.jaclo.core/app}
  :cljsbuild {
          :source-path "src-cljs"
          :compiler {
            :output-to "resources/public/cljs/main.js"
            :optimizations :whitespace
            :pretty-print true}}
  )
