import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import styles from './Animals.module.css';
import Pagination from '../Pagination/Pagination'; // Import the new component

const Animals = () => {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'dog', 'cat', 'other'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchAnimals = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/animals?filter=${filter}&page=${page}`);
        setAnimals(response.data.animals);
        setTotalPages(response.data.totalPages);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnimals();
  }, [filter, page]); // Revert to original dependencies

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1); // Reset to first page when filter changes
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const genderMap = {
    male: '수컷',
    female: '암컷',
    unknown: '불명'
  };

  return (
    <div className={styles.container}>
      <div className={styles.filterButtons}>
        <button onClick={() => handleFilterChange('all')} className={filter === 'all' ? styles.active : ''}>전체</button>
        <button onClick={() => handleFilterChange('dog')} className={filter === 'dog' ? styles.active : ''}>유기견</button>
        <button onClick={() => handleFilterChange('cat')} className={filter === 'cat' ? styles.active : ''}>유기묘</button>
        <button onClick={() => handleFilterChange('other')} className={filter === 'other' ? styles.active : ''}>기타</button>
      </div>

      {/* Removed shelter filter JSX */}

      {loading && <p>Loading...</p>}
      {error && <p>Error fetching data: {error.message}</p>}
      
      {!loading && !error && (
        <>
          <div className={styles.animalGrid}>
            {animals.map((animal) => (
              <div key={animal.animal_id} className={styles.animalCard}>
                <Link to={`/animal/${animal.animal_id}`} className={styles.animalCardLink}>
                  <img src={animal.image_url} alt={animal.species} className={styles.animalImage} onError={(e) => { e.target.src = '/images/unknown_animal.png'; }} />
                  <div className={styles.animalInfo}>
                    <p><strong>품종:</strong> {animal.species}</p>
                    <p><strong>생년:</strong> {animal.age}</p>
                    <p><strong>성별:</strong> {genderMap[animal.gender] || '정보 없음'}</p>
                    <p><strong>구조지역:</strong> {animal.region}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          <Pagination 
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default Animals;