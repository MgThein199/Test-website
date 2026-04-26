package com.nexus.library

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.nexus.library.databinding.ActivityReaderBinding
import io.noties.markwon.Markwon

class ReaderActivity : AppCompatActivity() {
    private lateinit var binding: ActivityReaderBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityReaderBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val title = intent.getStringExtra("EXTRA_TITLE") ?: ""
        val content = intent.getStringExtra("EXTRA_CONTENT") ?: ""

        binding.textTitle.text = title

        // Use Markwon library for markdown rendering
        val markwon = Markwon.create(this)
        markwon.setMarkdown(binding.textContent, content)
        
        binding.btnBack.setOnClickListener { finish() }
    }
}
