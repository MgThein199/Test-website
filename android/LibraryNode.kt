package com.nexus.library.model

import com.google.firebase.Timestamp
import com.google.firebase.firestore.IgnoreExtraProperties

@IgnoreExtraProperties
data class LibraryNode(
    var id: String = "",
    val title: String = "",
    val content: String = "",
    val parent_id: String = "root",
    val level: Int = 0,
    val order_index: Int = 0,
    val slug: String = "",
    val author_id: String = "",
    val created_at: Timestamp? = null,
    val updated_at: Timestamp? = null
)
