(ns net.kolov.jacla.view
  (:require [goog.dom :as dom]
            [goog.events :as events]
            [goog.ui.tree.TreeControl :as tree]
            [goog.ui.Component :as component]
            [clojure.string :as str]
            [clojure.browser.repl :as repl])
  (:require-macros [net.kolov.csutil :as csutil])
  (:use [jayq.core :only [$ css inner]]
        [jayq.util :only [map->js]]
        [kolu.core :only [query-update json-parse append-div clear-div connect]]
        )
  )


(defn set-status [x])
(csutil/defelement classes-div "classes")
(csutil/defelement packages-div "packages")
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
              (do (clear-div classes-div)
                (doseq [class-name classnames] (append-div classes-div "clazz" class-name)))))
    set-status))

(defn init-packages [url]
  "Reads all packages in a lib, filles the packages area"
  (query-update (make-lib-query-string url)
    (fn [x] (let [resp (.getResponse x)
                  v (json-parse resp)
                  packages (v "subgroups")]
              (do (doseq [package-name packages]
                    (events/listen (append-div packages-div "package" (make-package-link package-name))
                      (.-CLICK events/EventType) #(update-classes url package-name))
                    )
                (update-classes url (first packages)))
              )) set-status))

(defn parse-url [url]
  (let [parts (str/split url "/")
        n (count parts)]
    (cond (= n 5) {:library url}
      (= n 6) {:library ((str interpose "/" (take 5 parts))), :class (last parts)}))
  )

(defn ^:export initViewPage []
  (let [url (second (str/split (str (. js/window -location)) "/view/"))
        parts (parse-url url)
        library (:library parts)
        class (:class parts)
        ]
    (connect)
    (init-packages library)
    ;   (if class (update-classes library ) (do (update-classes library )))
    ))
