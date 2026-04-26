package com.nexus.library.service

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.nexus.library.model.LibraryNode

class LibraryService {
    private val db = FirebaseFirestore.getInstance()
    private val nodesCollection = db.collection("library_nodes")

    fun getAllNodes(onSuccess: (List<LibraryNode>) -> Unit, onFailure: (Exception) -> Unit) {
        nodesCollection
            .orderBy("order_index", Query.Direction.ASCENDING)
            .addSnapshotListener { snapshot, e ->
                if (e != null) {
                    onFailure(e)
                    return@addSnapshotListener
                }

                if (snapshot != null) {
                    val nodes = snapshot.documents.mapNotNull { doc ->
                        doc.toObject(LibraryNode::class.java)?.apply { id = doc.id }
                    }
                    onSuccess(nodes)
                }
            }
    }

    fun getNodesByParent(parentId: String, callback: (List<LibraryNode>) -> Unit) {
        nodesCollection
            .whereEqualTo("parent_id", parentId)
            .orderBy("order_index", Query.Direction.ASCENDING)
            .addSnapshotListener { snapshot, _ ->
                val nodes = snapshot?.documents?.mapNotNull { it.toObject(LibraryNode::class.java)?.apply { id = it.id } } ?: emptyList()
                callback(nodes)
            }
    }
}
