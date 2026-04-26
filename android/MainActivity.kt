package com.nexus.library

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.nexus.library.databinding.ActivityMainBinding
import com.nexus.library.model.LibraryNode
import com.nexus.library.service.LibraryService

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private val service = LibraryService()
    private val nodes = mutableListOf<LibraryNode>()

    override fun Bundle? {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupRecyclerView()
        loadCategories()
    }

    private fun setupRecyclerView() {
        binding.recyclerView.layoutManager = LinearLayoutManager(this)
        // Adapter implementation would go here, clicking an item opens sub-topics or ReaderActivity
    }

    private fun loadCategories() {
        service.getNodesByParent("root") { categories ->
            // Update Navigation Drawer or List with top-level categories
            setupDrawer(categories)
        }
    }

    private fun setupDrawer(categories: List<LibraryNode>) {
        // Logic to populate Material 3 Navigation Drawer
        // On category click, fetch sub-topics:
        // service.getNodesByParent(category.id) { ... }
    }
}
