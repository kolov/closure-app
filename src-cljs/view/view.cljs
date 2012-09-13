(ns net.kolov.jacla.view
  (:require [goog.net :as net]
            [goog.dom :as dom]
            [clojure.browser.repl :as repl]
            [goog.events :as events]
            [goog.ui.tree.TreeControl :as tree]
            [goog.ui.Component :as component]
            [clojure.string :as str])
  (:require-macros [net.kolov.csutil :as csutil])
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

(defn clear-div [node] (dom/removeChildren node))

(defn append-div [parent clazz content]
  (let [child (dom/createDom "div" {"class" clazz} content)]
    (dom/appendChild parent child) child))

(defn query-update [q f]
  "Query q and execute f on completion"
  (let [x (net/XhrIo.)]
    (events/listen x (.-SUCCESS goog.net.EventType) #(f x))
    (events/listen x (.-ERROR goog.net.EventType) #(set-status "Network error. Try again later"))
    (.send x q)))


(defn set-status [x])
(csutil/defelement classes "classes")
(csutil/defelement packages "packages")
(csutil/defelement class-source "class-source")

(defn make-lib-query-string [url]
  (str "/list/" url "/!"))
(defn make-package-query-string [url package]
  (str "/list/" url "/!/" package))

(defn make-package-link [p] p)

(defn update-classes [url package-name]
  (query-update (make-package-query-string url package-name)
    (fn [x] (let [resp (.getResponse x)
                  v (json-parse resp)
                  classnames (v "classnames")]
            ( do (clear-div classes)
              (doseq [class-name classnames] (append-div classes "clazz" class-name)))))))

(defn init-packages [url]
  (query-update (make-lib-query-string url)
    (fn [x] (let [resp (.getResponse x)
                  v (json-parse resp)
                  subgroups (v "subgroups")]
              (do (doseq [package-name subgroups]
                (events/listen (append-div packages "package" (make-package-link package-name))
                  (.-CLICK events/EventType) #(update-classes url package-name))

                )
              (update-classes url (first subgroups)))
              ))))

(defn ^:export initViewPage [] (let [url (second (str/split (str (. js/window -location)) "/view/"))]
                                 (init-packages url)))
