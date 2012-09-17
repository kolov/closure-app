(ns net.kolov.webapp
   (:require [goog.net.XhrIo :as gxhr]
            [goog.dom :as dom]
            [clojure.browser.repl :as repl]
            [goog.events :as events]
            [goog.ui.tree.TreeControl :as tree]
            [goog.ui.Component :as component]
            [clojure.string :as str]
            [clojure.browser.repl :as repl])
  (:require-macros [net.kolov.csutil :as csutil])
  (:use [jayq.core :only [$ css inner]])
  )

(defn clj->js
  "Recursively transforms ClojureScript maps into Javascript objects,
   other ClojureScript colls into JavaScript arrays, and ClojureScript
   keywords into JavaScript strings."
  [x]
  (cond
    (string? x) x
    (keyword? x) (name x)
    (map? x) (.strobj (reduce (fn [m [k v]]
               (assoc m (clj->js k) (clj->js v))) {} x))
    (coll? x) (apply array (map clj->js x))
    :else x))

