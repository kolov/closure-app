(ns net.kolov.jacla.search
  (:require
   [goog.net :as net] 
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
(csutil/defelement  libs-tree "libs-tree")
(csutil/defelement  libs-head "libs-head")
(csutil/defelement  classes-head "classes-head")
    
(defn query-update [q f]
  "Query q and execute f on completion"
  (let [x (net/XhrIo.)]
     (events/listen x (.-COMPLETE goog.net.EventType) #(f x))
     (.send x q)))

(def dom_ (dom/DomHelper.))
(defn append-div [parent clazz content]
  (dom/appendChild parent (dom/createDom "div" {"class" clazz} content)))

(defn set-div-text [d t]
   (.removeChildren dom_ d)
      (append-div d "title" t)
      )

(defn set-status [t] (set-div-text search-status t))
(defn set-classes-head [t] (set-div-text classes-head t))
(defn set-libs-head [t] (set-div-text libs-head t))

(defn classname [c] (str (c "packageName") "." (c "className")))
(defn libname [c] (str (c "packageId") ":" (c "artifactId")))

(def tree-config tree/defaultConfig)
(set! (.-cleardotPath tree-config) "/closure-library/closure/goog/images/tree/cleardot.gif")

(defn make-query-string [libnode]
  (-> (str "/list/maven/central/" (.getHtml libnode))
       (str/replace ":" "/")
       (str/replace "." "/")))

(defn make-lib-html [v]
  (if (v "source")
    (str "<a href=\"#\">Click </a>")
    (str "<span class=\"small\">no source</span>")))

(defn fill-libs [node]  
  (query-update
   (make-query-string node)
   (fn [x] (let [resp (.getResponse x)                
                 v (json-parse resp)
                 versions (v "versions")
                ]
             (.removeChildren node) 
             (doseq [version versions]
               (let [v-string (version "version")
                     newNode (.createNode (.getTree node) v-string)]
                 (.setAfterLabelHtml newNode (make-lib-html version))
                 (.add node newNode) ))))))

(defn create-tree-node [txt parent]
  (let [node  (.createNode (.getTree parent) txt)]
    (.setHtml node txt)
    (.add parent node)
    (.setExpanded node false)   
    (.add node (.createNode (.getTree node) "Loading...")) node))

(defn make-lib-tree [libs]
  (let [treeControl (goog.ui.tree.TreeControl. "root" tree-config)]
    (.removeChildren dom_ libs-tree)
    (doseq [lib libs] (create-tree-node (libname lib) treeControl))
    (.render treeControl libs-tree)
    (.setShowRootNode treeControl false)
    (doseq [node (.getChildren treeControl)]
      (events/listenOnce (.getElement node)  (.-CLICK events/EventType) #(fill-libs node) ))
    ))
   
(defn update-result [x]
  (let [resp (.getResponse x)
        v (json-parse resp)
        totalClasses (v "totalClasses")
        classes (v "classes")
        totalLibs (v "totalLibs")
        libs (v "libs")]
    (.removeChildren dom_ classes-container) 
    (set-classes-head (str "Found " totalClasses " classes"))
    (doseq [clazz classes]
      (append-div classes-container "clazz" (classname clazz)))
 
    (set-libs-head (str "Found " totalLibs " libs"))
   
    (make-lib-tree libs)
    ))



(defn query [t]
  (set-status "Searching...")
  (query-update (str "/search?token=" t) update-result))

(events/listen search-input (.-KEYUP events/EventType)
               (fn []
                 (let [txt (.-value search-input)]
                   (if (> (count txt) 1)
                     (query txt)
                     (set-status "Type at least 2 characters")))))
 
(defn ^export initSearchPage[]  (js/alert (str search-input)))
