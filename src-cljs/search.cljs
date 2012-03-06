(ns net.kolov.jacla.search
  (:require [clojure.browser.repl :as repl]
            [goog.dom :as dom] [goog.net :as net]
            [goog.events :as events]
            [goog.ui.tree.TreeControl :as tree])
  (:require-macros [net.kolov.csutil :as csutil])
  (:use [jayq.core :only [$ css inner]])
  )

; see how to config this
;(repl/connect "http://localhost:9000/repl")


(def jquery (js* "$"))

(defn json-generate
  "Returns a newline-terminate JSON string from the given
   ClojureScript data."
  [data]
  (str (JSON/stringify (clj->js data)) "\n"))

(defn json-parse
  "Returns ClojureScript data for the given JSON string."
  [line]
  (js->clj (JSON/parse line)))


(csutil/defelement  search-input "searchInput")
(csutil/defelement  search-status "searchStatus")
(csutil/defelement  classes-container "classes")
(csutil/defelement  libs-container "libs")
(csutil/defelement  libs-tree "libs-tree")
 

(def dom_ (dom/DomHelper.))
(defn append-div [parent clazz content]
  (dom/appendChild parent (dom/createDom "div" {"class" clazz} content)))

(defn set-status [t]
   (.removeChildren dom_ search-status)
      (append-div search-status "title" t)
      )

(defn classname [c] (str (c "packageName") "." (c "className")))
(defn libname [c] (str (c "artifactId") ":" (c "packageId")))

(def tree-config tree/defaultConfig)
(set! (.-cleardotPath tree-config) "/closure-library/closure/goog/images/tree/cleardot.gif")

(defn fill-libs [node] (js/alert node))
(defn create-tree-node [txt parent]
  (let [node  (.createNode (.getTree parent) txt)]
    (.setHtml node txt)
    (.add parent node)
    (.setExpanded node false)
   
    (.add node (.createNode (.getTree node) "x")) node))

(defn make-lib-tree [libs]
  (let [treeControl (goog.ui.tree.TreeControl. "root" tree-config)]
    (.removeChildren dom_ libs-tree)
    (doseq [lib libs] (create-tree-node (libname lib) treeControl))
    (.render treeControl libs-tree)
    (.setShowRootNode treeControl false)
     (events/listen treeControl (.-FOCUS events/EventType) #(fill-libs %))
    ))
   
(defn update-result [x]
  (let [resp (.getResponse x)
        v (json-parse resp)
        totalClasses (v "totalClasses")
        classes (v "classes")
        totalLibs (v "totalLibs")
        libs (v "libs")]
    (.removeChildren dom_ classes-container)
    (append-div classes-container "title" (str "Found " totalClasses " classes"))
    (doseq [clazz classes]
      (append-div classes-container "clazz" (classname clazz)))
    (.removeChildren dom_ libs-container)
    (append-div libs-container "title" (str "Found " totaLibs " libs"))
    (doseq [lib libs]
      (append-div libs-container "clazz" (libname lib)))
    (make-lib-tree libs)
    ))

(defn query [t]
  (set-status "Searching...")
      (let [x (net/XhrIo.)]
        (do
          (events/listen x (.-COMPLETE net/EventType) #(update-result x))
          (.send x (str "/search?token=" t)))))

(events/listen search-input (.-KEYUP events/EventType)
               (fn []
                 (let [txt (.-value search-input)]
                   (if (> (count txt) 1)
                     (query txt)
                     (set-status "Type at least 2 characters")))))
 
(defn ^export initSearchPage[]  (js/alert (str search-input)))
