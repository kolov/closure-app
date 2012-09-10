(ns net.kolov.jacla.shared
  (:require [goog.net :as net]
            [goog.dom :as dom]
            [clojure.browser.repl :as repl]
            [goog.events :as events]
            [goog.ui.tree.TreeControl :as tree]
            [goog.ui.Component :as component]
            )
  (:use [jayq.core :only [$ css inner]])
  )

; see how to config this
;(repl/connect "http://localhost:9000/repl")


(def jquery (js* "$"))

(defn json-generate
  "Returns a newline-terminated JSON string from ClojureScript data."
  [data]
  (str (JSON/stringify (clj->js data)) "\n"))

(defn json-parse
  "Returns ClojureScript data from a JSON string."
  [line]
  (js->clj (JSON/parse line)))

(def dom_ (dom/DomHelper.))

(defn query-update [q f]
  "Query q and execute f on completion"
  (let [x (net/XhrIo.)]
    (events/listen x (.-SUCCESS goog.net.EventType) #(f x))
    (events/listen x (.-ERROR goog.net.EventType) #(set-status "Network error. Try again later"))
    (.send x q)))

