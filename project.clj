(defproject cloure-app "1.0.0-SNAPSHOT"
  :description "ClojureScript/Google Composure app"
  :dependencies [[org.clojure/clojure "1.4.0"]
                 [kolu "0.1.0-SNAPSHOT"]
                 [compojure "1.1.3"]
                 [clj-stacktrace "0.2.4"]
                 [ring/ring-core "1.1.0-SNAPSHOT"]
                 [clj-http "0.3.0"]
                 [jayq "0.1.0-alpha4"]
                 [ring/ring-jetty-adapter "1.1.0-SNAPSHOT"]]
  :dev-dependencies [[ring/ring-devel "1.1.0-SNAPSHOT"]
                     [lein-ring "0.5.4"]
                     [ring-serve "0.1.1"]
                     ]
  :plugins [[lein-cljsbuild "0.2.7"]
            [lein-swank "1.4.4"]]
  :main net.kolov.jaclo.server
  :ring {:handler net.kolov.jaclo.core/app}
  ;  :hooks [leiningen.cljsbuild]
  :cljsbuild {:builds [{:source-path "src-cljs/search",
                        :compiler {:pretty-print true,
                                   :output-to "resources/public/cljs/search.js",
                                   :optimizations :whitespace}}
                       {:source-path "src-cljs/view",
                        :compiler {:pretty-print true,
                                   :output-to "resources/public/cljs/view.js",
                                   :optimizations :whitespace}}
                       ]
              :repl-listen-port 9000
              :repl-launch-commands {
                                      "la" ["firefox" "-jsconsole" "http://localhost/my-page"]
                                      }
              }
  )
